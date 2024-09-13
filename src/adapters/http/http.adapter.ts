abstract class HttpAdapter {
    abstract post(endpoint: string, body?: Record<string, any>): Promise<HttpResponse>
}