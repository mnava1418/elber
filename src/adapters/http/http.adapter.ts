abstract class HttpAdapter {
    abstract post<T>(endpoint: string, body?: Record<string, any>, token?: string): Promise<T>
    abstract get<T>(endpoint: string, token?: string): Promise<T>
    abstract delete<T>(endpoint: string, token?: string): Promise<T>
}