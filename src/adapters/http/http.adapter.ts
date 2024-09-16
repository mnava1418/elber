abstract class HttpAdapter {
    abstract post<T>(endpoint: string, body?: Record<string, any>, token?: string): Promise<T>
}