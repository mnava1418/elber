import type { Router } from 'express'
import { createFirebaseTokenVerifier } from '../../shared/auth/token-verifier.js'
import { firebaseAuth, firestore } from '../../shared/firebase/firebase-admin.js'
import { buildRequireAuth } from '../../shared/http/middlewares/auth.middleware.js'
import GetProgressUseCase from './application/get-progress.use-case.js'
import GetSummaryUseCase from './application/get-summary.use-case.js'
import ManageMeasurementsUseCase from './application/manage-measurements.use-case.js'
import ManagePlansUseCase from './application/manage-plans.use-case.js'
import ManageProfileUseCase from './application/manage-profile.use-case.js'
import TrackSessionsUseCase from './application/track-sessions.use-case.js'
import {
    FirestoreMeasurementRepository, FirestorePlanRepository, FirestoreProfileRepository, FirestoreSessionRepository,
} from './infrastructure/firestore-training.repositories.js'
import { buildCoach, type TrainingCoach } from './presentation/coach.js'
import TrainingController, { type TrainingUseCases } from './presentation/training.controller.js'
import buildTrainingRoutes from './presentation/training.routes.js'

// Public entry point of the training module: the user's profile, plans,
// sessions and measurements. It owns this data: the training page reaches it
// through the router, and the chat's coach skill through `coach`, which
// app.ts plugs into the chat (modules never import each other).
export interface TrainingModule {
    router: Router
    coach: TrainingCoach
}

const createTrainingModule = (): TrainingModule => {
    const plans = new FirestorePlanRepository(firestore)
    const sessions = new FirestoreSessionRepository(firestore)
    const profiles = new FirestoreProfileRepository(firestore)
    const measurements = new FirestoreMeasurementRepository(firestore)

    const useCases: TrainingUseCases = {
        profile: new ManageProfileUseCase(profiles),
        plans: new ManagePlansUseCase(plans),
        sessions: new TrackSessionsUseCase(sessions, plans),
        measurements: new ManageMeasurementsUseCase(measurements),
        summary: new GetSummaryUseCase(profiles, plans, sessions, measurements),
        progress: new GetProgressUseCase(plans, measurements),
    }

    return {
        router: buildTrainingRoutes(buildRequireAuth(createFirebaseTokenVerifier(firebaseAuth)), new TrainingController(useCases)),
        coach: buildCoach(useCases),
    }
}

export default createTrainingModule
