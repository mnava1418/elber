import axios, { AxiosError, AxiosInstance } from "axios";

class AxiosAdapter implements HttpAdapter {
    private axiosInstance: AxiosInstance

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: 'http://192.168.1.153:4041',
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    async post<T>(endpoint: string, body?: Record<string, any>, token?: string): Promise<T> {
        try {
            if(token) {
                this.axiosInstance.defaults.headers.post['token'] = token
            }
            
            const {data} = await this.axiosInstance.post<T>(endpoint, body)
            return data
        } catch (error) {
            if(error instanceof AxiosError) {
                throw new Error(error.response?.data.error);
            } else {
                throw new Error(`Unable to fetch data from: ${endpoint} `)
            }
        }
    }
}

export default AxiosAdapter
