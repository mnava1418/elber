class CustomError extends Error {
    type: CustomErrorType

    constructor(message: string, type?: CustomErrorType) {
        super(message)
        this.type = type ? type : 'default'
    }
}

export default CustomError