import * as express from 'express';

import {router as loginRouter} from 'server/routes/auth/login';
import {router as logoutRouter} from 'server/routes/auth/logout';
import {router as registerRouter} from 'server/routes/auth/register';

export const router = express.Router();

router.use('/login', loginRouter);

router.use('/logout', logoutRouter);

router.use('/register', registerRouter);
