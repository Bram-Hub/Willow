import * as express from 'express';

import {router as rosterRouter} from 'server/routes/courses/course/roster';

export const router = express.Router({mergeParams: true});

router.use('/roster', rosterRouter);
