const SAFE_BASE_URLS = {
    sandbox: {
        api: 'https://sandbox.api.getsafepay.com',
        checkout: 'https://getsafepay.com/checkout/pay',
    },
    production: {
        api: 'https://api.getsafepay.com',
        checkout: 'https://getsafepay.com/checkout/pay',
    },
} as const

type SafepayEnvironment = keyof typeof SAFE_BASE_URLS

function getSafepayEnvironment(): SafepayEnvironment {
    return process.env.SAFEPAY_ENVIRONMENT === 'production' ? 'production' : 'sandbox'
}

function getAppUrl() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function buildSafepayCheckoutUrl(tracker: string, bookingId: string) {
    const env = getSafepayEnvironment()
    const appUrl = getAppUrl()
    const url = new URL(SAFE_BASE_URLS[env].checkout)

    url.searchParams.set('env', env)
    url.searchParams.set('tracker', tracker)
    url.searchParams.set('source', 'hosted')
    url.searchParams.set('redirect_url', `${appUrl}/api/payments/safepay/success?bookingId=${bookingId}`)
    url.searchParams.set('cancel_url', `${appUrl}/api/payments/safepay/cancel?bookingId=${bookingId}`)

    return url.toString()
}

export async function createSafepayTracker({
    amount,
    currency = 'PKR',
    bookingId,
}: {
    amount: number
    currency?: string
    bookingId: string
}) {
    const apiKey = process.env.SAFEPAY_PUBLIC_KEY
    const secretKey = process.env.SAFEPAY_SECRET_KEY

    if (!apiKey || !secretKey) {
        throw new Error('Safepay API keys are not configured')
    }

    const env = getSafepayEnvironment()
    const appUrl = getAppUrl()

    try {
        // Use correct Safepay API endpoint - no trailing slash
        const endpoint = `${SAFE_BASE_URLS[env].api}/order/v1/init`

        console.log('Calling Safepay endpoint:', endpoint)
        console.log('Environment:', env)
        console.log('Amount (paisa):', Math.round(amount * 100))

        const requestBody = {
            amount: Math.round(amount * 100),
            currency,
            environment: env,
            client: apiKey,
            source: 'custom',
            webhook_url: `${appUrl}/api/payments/safepay/webhook`,
            redirect_url: `${appUrl}/api/payments/safepay/success?bookingId=${bookingId}`,
            cancel_url: `${appUrl}/api/payments/safepay/cancel?bookingId=${bookingId}`,
            metadata: {
                bookingId,
                source: 'nexride',
            },
        }

        console.log('Request body:', JSON.stringify(requestBody, null, 2))

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'X-SFPY-CLIENT-ID': apiKey,
                'X-SFPY-CLIENT-SECRET': secretKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        })

        console.log('Response status:', response.status)
        console.log('Response headers:', Object.fromEntries(response.headers.entries()))

        const responseText = await response.text()
        console.log('Response text (first 500 chars):', responseText.substring(0, 500))

        let data = null
        try {
            data = JSON.parse(responseText)
        } catch (parseError) {
            console.error('Failed to parse response as JSON. Response was:', responseText)
            throw new Error('Safepay returned invalid JSON response. Check API credentials and endpoint.')
        }

        if (!response.ok) {
            console.error('Safepay API Error:', {
                status: response.status,
                statusText: response.statusText,
                data,
                endpoint,
            })
            throw new Error(data?.message || data?.error || `Safepay API returned ${response.status}: ${response.statusText}`)
        }

        console.log('Safepay API Response:', JSON.stringify(data, null, 2))

        // Safepay returns tracker in data.token
        const tracker =
            data?.token ||
            data?.tracker ||
            data?.data?.token ||
            data?.data?.tracker ||
            data?.data?.tracker?.token ||
            data?.payment?.token ||
            data?.payment?.tracker

        if (!tracker) {
            console.error('Safepay Response Missing Tracker. Full response:', JSON.stringify(data, null, 2))
            console.error('Response keys:', Object.keys(data || {}))
            if (data?.data) {
                console.error('data.data keys:', Object.keys(data.data))
            }
            throw new Error('Safepay did not return a tracker token')
        }

        console.log('Safepay tracker created successfully:', tracker.substring(0, 20) + '...')
        return tracker as string
    } catch (error) {
        console.error('Safepay Tracker Creation Error:', error)
        if (error instanceof Error) {
            throw error
        }
        throw new Error('Failed to create Safepay payment session')
    }
}
