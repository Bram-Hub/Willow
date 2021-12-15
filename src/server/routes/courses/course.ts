import * as express from 'express';

import {router as assignmentsRouter} from 'server/routes/courses/course/assignments';
import {router as rosterRouter} from 'server/routes/courses/course/roster';

export const router = express.Router({mergeParams: true});

router.use('/assignments', assignmentsRouter);

router.use('/roster', rosterRouter);
