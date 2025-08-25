import { BehavioralInterventionType } from '../models/Experiment';

export const behavioralInterventions = {
  [BehavioralInterventionType.LOSS_AVERSION]: {
    name: 'Loss Aversion',
    description: 'Emphasize what users might lose rather than what they might gain',
    defaultConfig: {
      message: {
        template: "Don't lose access to {{feature}}",
        variables: ['feature'],
      },
      timing: {
        trigger: 'exit_intent',
        delay: 0,
      },
      visual: {
        type: 'modal',
        style: 'warning',
        prominence: 'high',
      },
    },
    examples: [
      'Your {{days}} day trial expires soon - Don\'t lose your data!',
      'You\'ll lose {{count}} unsaved changes if you leave now',
      'Cancel anytime - but you\'ll lose these exclusive features',
    ],
  },

  [BehavioralInterventionType.SOCIAL_PROOF]: {
    name: 'Social Proof',
    description: 'Show evidence of other users taking desired actions',
    defaultConfig: {
      dataSource: {
        type: 'dynamic', // or 'static'
        updateFrequency: 'realtime', // or 'hourly', 'daily'
      },
      display: {
        format: 'notification', // or 'badge', 'counter', 'testimonial'
        position: 'bottom-left',
      },
      content: {
        template: '{{count}} people {{action}} in the last {{timeframe}}',
        variables: ['count', 'action', 'timeframe'],
      },
    },
    examples: [
      '234 companies started using this feature today',
      'Join 10,000+ teams already using our platform',
      'Sarah from Acme Corp just upgraded their plan',
    ],
  },

  [BehavioralInterventionType.COMMITMENT_DEVICES]: {
    name: 'Commitment Devices',
    description: 'Help users commit to goals and follow through',
    defaultConfig: {
      commitment: {
        type: 'goal_setting', // or 'public_commitment', 'schedule'
        visibility: 'private', // or 'team', 'public'
      },
      reminders: {
        enabled: true,
        frequency: 'weekly',
        channel: 'email', // or 'in_app', 'push'
      },
      tracking: {
        showProgress: true,
        celebrateMilestones: true,
      },
    },
    examples: [
      'Set a weekly goal for active users',
      'Commit to launching 3 experiments this month',
      'Schedule regular check-ins for your team',
    ],
  },

  [BehavioralInterventionType.PROGRESS_INDICATORS]: {
    name: 'Progress Indicators',
    description: 'Show users their progress toward goals',
    defaultConfig: {
      visual: {
        type: 'progress_bar', // or 'checklist', 'percentage', 'steps'
        showPercentage: true,
        animated: true,
      },
      milestones: {
        enabled: true,
        rewards: ['badge', 'message', 'unlock_feature'],
      },
      persistence: {
        saveProgress: true,
        showOnReturn: true,
      },
    },
    examples: [
      'Setup Progress: 3 of 5 steps complete',
      '75% complete - just one more step!',
      'Level 2 unlocked! 🎉 Next: Advanced Features',
    ],
  },

  [BehavioralInterventionType.SCARCITY_URGENCY]: {
    name: 'Scarcity & Urgency',
    description: 'Create time or quantity limits to encourage action',
    defaultConfig: {
      scarcity: {
        type: 'time_based', // or 'quantity_based', 'both'
        display: 'countdown', // or 'message', 'badge'
      },
      urgency: {
        deadline: null, // ISO date or relative time
        showTimer: true,
        warningThresholds: [24, 6, 1], // hours
      },
      messaging: {
        tone: 'helpful', // or 'urgent', 'exclusive'
        updateFrequency: 'dynamic',
      },
    },
    examples: [
      'Offer expires in 2 hours 34 minutes',
      'Only 3 spots left at this price',
      'Early bird pricing ends tomorrow',
    ],
  },

  [BehavioralInterventionType.ANCHORING]: {
    name: 'Anchoring',
    description: 'Set reference points that influence decisions',
    defaultConfig: {
      anchor: {
        type: 'price', // or 'feature', 'usage', 'comparison'
        position: 'first', // or 'prominent', 'contextual'
      },
      comparison: {
        showOriginal: true,
        highlight: 'savings', // or 'value', 'popular'
      },
      visual: {
        strikethrough: true,
        emphasizeDifference: true,
      },
    },
    examples: [
      'Regular price: $299 Now: $99 (Save 67%)',
      'Most teams use 50 API calls/day (You: 10)',
      'Enterprise Plan | Growth Plan (Recommended) | Starter Plan',
    ],
  },

  [BehavioralInterventionType.RECIPROCITY]: {
    name: 'Reciprocity',
    description: 'Give value first to encourage reciprocal action',
    defaultConfig: {
      gift: {
        type: 'trial_extension', // or 'free_feature', 'content', 'credits'
        timing: 'immediate', // or 'delayed', 'conditional'
      },
      followUp: {
        delay: 3, // days
        action: 'soft_ask', // or 'feedback', 'upgrade'
      },
      messaging: {
        emphasizeValue: true,
        noStringsAttached: true,
      },
    },
    examples: [
      'Here\'s a free 7-day extension to try our premium features',
      'We\'ve unlocked advanced analytics for your account this week',
      'Free guide: 10 ways to improve conversion (no email required)',
    ],
  },
};