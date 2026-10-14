import { Router, Request, Response } from 'express';
import initUserServices from '../../modules/user_services/index.js';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
    res.status(200).json({status: 'OK'})
})

router.use('/user', initUserServices())

export default router