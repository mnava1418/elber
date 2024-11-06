import AxiosAdapter from "./axios.adapter";

export const getAxiosFetcher = (url: string ): AxiosAdapter => {
    const axiosFetcher = new AxiosAdapter(url)
    return axiosFetcher

}
