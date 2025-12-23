package io.starbidz.core

import android.content.Context
import android.os.Build
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

internal class StarbidzClient(
    private val config: StarbidConfig
) {
    private val client = OkHttpClient.Builder()
        .connectTimeout(config.requestTimeoutMs, TimeUnit.MILLISECONDS)
        .readTimeout(config.requestTimeoutMs, TimeUnit.MILLISECONDS)
        .writeTimeout(config.requestTimeoutMs, TimeUnit.MILLISECONDS)
        .build()

    private val moshi = Moshi.Builder()
        .add(KotlinJsonAdapterFactory())
        .build()

    private val bidRequestAdapter = moshi.adapter(BidRequest::class.java)
    private val bidResponseAdapter = moshi.adapter(BidResponse::class.java)

    suspend fun requestBid(
        context: Context,
        placementId: String,
        format: AdFormat,
        width: Int? = null,
        height: Int? = null
    ): AdResult = withContext(Dispatchers.IO) {
        try {
            val deviceInfo = collectDeviceInfo(context)
            val appInfo = collectAppInfo(context)

            val bidRequest = BidRequest(
                appKey = config.appKey,
                placementId = placementId,
                format = format.name.lowercase(),
                width = width,
                height = height,
                device = deviceInfo,
                app = appInfo,
                test = config.testMode
            )

            val jsonBody = bidRequestAdapter.toJson(bidRequest)
            val requestBody = jsonBody.toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("${config.serverUrl}/v1/bid")
                .post(requestBody)
                .build()

            val response = client.newCall(request).execute()

            if (!response.isSuccessful) {
                return@withContext AdResult.Error("HTTP ${response.code}", response.code)
            }

            val responseBody = response.body?.string()
                ?: return@withContext AdResult.Error("Empty response")

            val bidResponse = bidResponseAdapter.fromJson(responseBody)
                ?: return@withContext AdResult.Error("Parse error")

            if (!bidResponse.success || bidResponse.bid == null) {
                return@withContext AdResult.NoBid
            }

            val bid = bidResponse.bid
            val creativeType = when (bid.creative.type) {
                "html" -> StarbidzAd.CreativeType.HTML
                "vast" -> StarbidzAd.CreativeType.VAST
                "image" -> StarbidzAd.CreativeType.IMAGE
                else -> StarbidzAd.CreativeType.HTML
            }

            AdResult.Success(
                StarbidzAd(
                    bidId = bid.id,
                    price = bid.price,
                    currency = bid.currency,
                    demandSource = bid.demandSource,
                    creative = StarbidzAd.Creative(
                        type = creativeType,
                        content = bid.creative.content,
                        width = bid.creative.width,
                        height = bid.creative.height
                    ),
                    notifyUrl = bid.nurl,
                    billingUrl = bid.burl
                )
            )
        } catch (e: Exception) {
            AdResult.Error(e.message ?: "Unknown error")
        }
    }

    suspend fun trackEvent(
        eventType: String,
        bidId: String,
        placementId: String
    ) = withContext(Dispatchers.IO) {
        try {
            val event = mapOf(
                "event_type" to eventType,
                "bid_id" to bidId,
                "placement_id" to placementId,
                "timestamp" to System.currentTimeMillis()
            )

            val jsonBody = moshi.adapter(Map::class.java).toJson(event)
            val requestBody = jsonBody.toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("${config.serverUrl}/v1/events")
                .post(requestBody)
                .build()

            client.newCall(request).execute()
        } catch (_: Exception) {
            // Ignore tracking errors
        }
    }

    private fun collectDeviceInfo(context: Context): DeviceInfo {
        val advertisingId = getAdvertisingId(context)
        return DeviceInfo(
            os = "android",
            osv = Build.VERSION.RELEASE,
            make = Build.MANUFACTURER,
            model = Build.MODEL,
            ifa = advertisingId ?: "",
            lmt = advertisingId == null,
            connectionType = getConnectionType(context)
        )
    }

    private fun collectAppInfo(context: Context): AppInfo {
        val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        val appName = context.applicationInfo.loadLabel(context.packageManager).toString()
        return AppInfo(
            bundle = context.packageName,
            version = packageInfo.versionName ?: "1.0.0",
            name = appName
        )
    }

    private fun getAdvertisingId(context: Context): String? {
        return try {
            val adIdClass = Class.forName("com.google.android.gms.ads.identifier.AdvertisingIdClient")
            val infoMethod = adIdClass.getMethod("getAdvertisingIdInfo", Context::class.java)
            val adInfo = infoMethod.invoke(null, context)
            val idMethod = adInfo.javaClass.getMethod("getId")
            val isLimitedMethod = adInfo.javaClass.getMethod("isLimitAdTrackingEnabled")
            val isLimited = isLimitedMethod.invoke(adInfo) as Boolean
            if (isLimited) null else idMethod.invoke(adInfo) as String?
        } catch (_: Exception) {
            null
        }
    }

    private fun getConnectionType(context: Context): String {
        return try {
            val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE)
                as? android.net.ConnectivityManager
            val network = connectivityManager?.activeNetwork
            val capabilities = connectivityManager?.getNetworkCapabilities(network)
            when {
                capabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_WIFI) == true -> "wifi"
                capabilities?.hasTransport(android.net.NetworkCapabilities.TRANSPORT_CELLULAR) == true -> "cellular"
                else -> "unknown"
            }
        } catch (_: Exception) {
            "unknown"
        }
    }
}

// Internal DTOs
internal data class BidRequest(
    val appKey: String,
    val placementId: String,
    val format: String,
    val width: Int?,
    val height: Int?,
    val device: DeviceInfo,
    val app: AppInfo,
    val test: Boolean
)

internal data class DeviceInfo(
    val os: String,
    val osv: String,
    val make: String,
    val model: String,
    val ifa: String,
    val lmt: Boolean,
    val connectionType: String
)

internal data class AppInfo(
    val bundle: String,
    val version: String,
    val name: String
)

internal data class BidResponse(
    val success: Boolean,
    val bid: Bid?,
    val error: String?
)

internal data class Bid(
    val id: String,
    val price: Double,
    val currency: String,
    val demandSource: String,
    val creative: Creative,
    val nurl: String?,
    val burl: String?
)

internal data class Creative(
    val type: String,
    val content: String,
    val width: Int?,
    val height: Int?
)
