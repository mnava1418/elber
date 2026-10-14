import express from 'express'
import serverRoutes from './routes.js'

const app = express();

const setRoutes = () => {
    app.use('/', serverRoutes)
}

setRoutes()

export default app