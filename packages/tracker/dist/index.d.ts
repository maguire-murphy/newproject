interface Config {
    apiUrl?: string;
    debug?: boolean;
}
interface EventProperties {
    [key: string]: any;
}
declare class BehaviorOptTracker {
    private trackingId;
    private apiUrl;
    private userId;
    private sessionId;
    private assignments;
    private eventQueue;
    private config;
    init(trackingId: string, config?: Config): void;
    identify(userId: string, properties?: Record<string, any>): void;
    track(eventType: string, properties?: EventProperties): void;
    getVariant(experimentId: string): string | null;
    applyInterventions(): void;
    private applyIntervention;
    private loadAssignments;
    private flush;
    private setupBatching;
    private getOrCreateUserId;
    private generateSessionId;
    private generateId;
    private getContext;
    private getDeviceType;
}
declare const tracker: BehaviorOptTracker;
export default tracker;
