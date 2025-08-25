interface Config {
  apiUrl?: string;
  debug?: boolean;
}

interface User {
  id: string;
  email?: string;
  properties?: Record<string, any>;
}

interface EventProperties {
  [key: string]: any;
}

class BehaviorOptTracker {
  private trackingId: string = '';
  private apiUrl: string = 'http://localhost:4000';
  private userId: string = '';
  private sessionId: string = '';
  private assignments: Record<string, string> = {};
  private eventQueue: any[] = [];
  private config: Config = {};

  init(trackingId: string, config: Config = {}) {
    this.trackingId = trackingId;
    this.config = config;
    this.apiUrl = config.apiUrl || this.apiUrl;
    this.sessionId = this.generateSessionId();
    
    // Get or create anonymous user ID
    this.userId = this.getOrCreateUserId();
    
    // Load variant assignments
    this.loadAssignments();
    
    // Set up event batching
    this.setupBatching();
    
    if (config.debug) {
      console.log('BehaviorOpt initialized', { trackingId, userId: this.userId });
    }
  }

  identify(userId: string, properties?: Record<string, any>) {
    this.userId = userId;
    localStorage.setItem('behavioropt_user_id', userId);
    
    this.track('$identify', properties);
  }

  track(eventType: string, properties?: EventProperties) {
    const event = {
      userId: this.userId,
      eventType,
      properties: properties || {},
      context: this.getContext(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
    };

    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= 10) {
      this.flush();
    }
  }

  getVariant(experimentId: string): string | null {
    return this.assignments[experimentId] || null;
  }

  applyInterventions() {
    // This will be called to apply behavioral interventions
    Object.entries(this.assignments).forEach(([experimentId, variantId]) => {
      this.applyIntervention(experimentId, variantId);
    });
  }

  private applyIntervention(experimentId: string, variantId: string) {
    // Fetch intervention configuration and apply it
    // This is where behavioral interventions are rendered
    if (this.config.debug) {
      console.log('Applying intervention', { experimentId, variantId });
    }
  }

  private async loadAssignments() {
    try {
      const response = await fetch(`${this.apiUrl}/api/tracking/${this.trackingId}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.assignments = data.assignments || {};
        this.applyInterventions();
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to load assignments', error);
      }
    }
  }

  private async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch(`${this.apiUrl}/api/tracking/${this.trackingId}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      // Re-queue events on failure
      this.eventQueue = events.concat(this.eventQueue);
      
      if (this.config.debug) {
        console.error('Failed to send events', error);
      }
    }
  }

  private setupBatching() {
    // Flush events every 5 seconds
    setInterval(() => this.flush(), 5000);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  private getOrCreateUserId(): string {
    let userId = localStorage.getItem('behavioropt_user_id');
    
    if (!userId) {
      userId = `anon_${this.generateId()}`;
      localStorage.setItem('behavioropt_user_id', userId);
    }
    
    return userId;
  }

  private generateSessionId(): string {
    return `sess_${this.generateId()}`;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getContext() {
    return {
      url: window.location.href,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      deviceType: this.getDeviceType(),
    };
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}

// Export for module systems and global
const tracker = new BehaviorOptTracker();

if (typeof window !== 'undefined') {
  (window as any).BehaviorOpt = tracker;
}

export default tracker;