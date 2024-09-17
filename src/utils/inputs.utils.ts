export const isValidEmail = (email: string) => {
    if (/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return true
    } else {
        return false
    }
}