import UserAuthController from "./controllers/auth.controller.js"
import buildRoutes from "./routes/index.routes.js"
import UserAuthServices from "./services/auth.service.js"

const initUserServices = () => {
    const authService = new UserAuthServices()
    const authController = new UserAuthController(authService) 
    return buildRoutes({auth: authController})
}

export default initUserServices 