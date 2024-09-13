import axios, { AxiosInstance } from "axios";

class AxiosAdapter implements HttpAdapter {
    private axiosInstance: AxiosInstance

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: 'http://localhost:4041',
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    async post(endpoint: string, body?: Record<string, any>): Promise<HttpResponse> {
        try {
            const {data, status} = await this.axiosInstance.post<HttpResponse>(endpoint, body)
            return {data, status}
        } catch (error) {
            throw new Error(`Unable to fetch data from: ${endpoint} `)
        }
    }
}

export default AxiosAdapter
