import axios, { AxiosError, AxiosInstance } from "axios";

class AxiosAdapter implements HttpAdapter {
    private axiosInstance: AxiosInstance

    constructor(url: string) {
        this.axiosInstance = axios.create({
            baseURL: url,
            headers: {
                'Content-Type': 'application/json'
            }
        })
    }

    async post<T>(endpoint: string, body?: Record<string, any>, token?: string): Promise<T> {
        try {
            if(token) {
                this.axiosInstance.defaults.headers.Authorization = `Bearer ${token}`
            }
            
            const {data} = await this.axiosInstance.post<T>(endpoint, body)
            return data
        } catch (error) {
            if(error instanceof AxiosError && error.response?.data.error) {
                throw new Error(error.response?.data.error);
            } else {
                throw new Error(`Unable to fetch data from: ${endpoint} `)
            }
        }
    }

    async get<T>(endpoint: string, token?: string): Promise<T> {
        try {
            if(token) {
                this.axiosInstance.defaults.headers.Authorization = `Bearer ${token}`
            }
            
            const {data} = await this.axiosInstance.get<T>(endpoint)
            return data
        } catch (error) {
            if(error instanceof AxiosError && error.response?.data.error) {
                throw new Error(error.response?.data.error);
            } else {
                throw new Error(`Unable to fetch data from: ${endpoint} `)
            }
        }
    }
}

export default AxiosAdapter
