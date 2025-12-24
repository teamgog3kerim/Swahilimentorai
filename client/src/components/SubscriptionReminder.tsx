import { useState } from "react";
import { differenceInDays, differenceInHours } from "date-fns";
import { AlertCircle, Clock, Crown, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

interface SubscriptionReminderProps {
  user: User;
  onUpgrade: () => void;
}

type ReminderType = "trial_expiring_soon" | "trial_expiring_today" | "trial_expired" | "subscription_expiring" | "subscription_expired" | null;

function getTrialEndDate(user: User): Date {
  const createdAt = new Date(user.createdAt);
  const trialEnd = new Date(createdAt);
  trialEnd.setDate(trialEnd.getDate() + 7);
  return trialEnd;
}

function getReminderType(user: User): ReminderType {
  const now = new Date();
  
  // Check if user has an active subscription (either isPremium or valid subscriptionEndsAt)
  if (user.subscriptionEndsAt) {
    const subEnd = new Date(user.subscriptionEndsAt);
    const daysUntilExpiry = differenceInDays(subEnd, now);
    
    if (subEnd < now) {
      return "subscription_expired";
    }
    if (daysUntilExpiry <= 3) {
      return "subscription_expiring";
    }
    // Active subscription, no reminder needed
    return null;
  }
  
  // No subscription - check trial status
  if (!user.isPremium && !user.subscriptionEndsAt) {
    const trialEnd = getTrialEndDate(user);
    const daysUntilExpiry = differenceInDays(trialEnd, now);
    const hoursUntilExpiry = differenceInHours(trialEnd, now);
    
    if (trialEnd < now) {
      return "trial_expired";
    }
    if (hoursUntilExpiry <= 24) {
      return "trial_expiring_today";
    }
    if (daysUntilExpiry <= 3) {
      return "trial_expiring_soon";
    }
  }
  
  return null;
}

export function SubscriptionReminder({ user, onUpgrade }: SubscriptionReminderProps) {
  const [dismissed, setDismissed] = useState(false);
  
  const reminderType = getReminderType(user);
  
  if (!reminderType || dismissed) {
    return null;
  }
  
  const trialEnd = getTrialEndDate(user);
  const now = new Date();
  const daysLeft = Math.max(0, differenceInDays(trialEnd, now));
  const hoursLeft = Math.max(0, differenceInHours(trialEnd, now));
  
  const subEnd = user.subscriptionEndsAt ? new Date(user.subscriptionEndsAt) : null;
  const subDaysLeft = subEnd ? Math.max(0, differenceInDays(subEnd, now)) : 0;
  
  const reminderConfig: Record<NonNullable<ReminderType>, {
    variant: "default" | "destructive";
    icon: typeof AlertCircle;
    title: string;
    description: string;
    buttonText: string;
    canDismiss: boolean;
  }> = {
    trial_expiring_soon: {
      variant: "default",
      icon: Clock,
      title: "试用期即将结束",
      description: `您的7天免费试用还剩 ${daysLeft} 天。订阅后可无限制练习对话。`,
      buttonText: "立即订阅",
      canDismiss: true,
    },
    trial_expiring_today: {
      variant: "destructive",
      icon: AlertCircle,
      title: "试用期今天到期",
      description: `您的免费试用将在 ${hoursLeft} 小时内结束。立即订阅以继续学习。`,
      buttonText: "立即订阅",
      canDismiss: false,
    },
    trial_expired: {
      variant: "destructive",
      icon: AlertCircle,
      title: "试用期已结束",
      description: "您的7天免费试用已结束。订阅以继续无限制练习和访问所有课程。",
      buttonText: "订阅继续学习",
      canDismiss: false,
    },
    subscription_expiring: {
      variant: "default",
      icon: Crown,
      title: "订阅即将到期",
      description: `您的高级订阅还剩 ${subDaysLeft} 天。续订以保持无限制访问。`,
      buttonText: "续订",
      canDismiss: true,
    },
    subscription_expired: {
      variant: "destructive",
      icon: AlertCircle,
      title: "订阅已过期",
      description: "您的高级订阅已过期。续订以继续无限制访问所有功能。",
      buttonText: "立即续订",
      canDismiss: false,
    },
  };
  
  const config = reminderConfig[reminderType];
  const IconComponent = config.icon;
  
  return (
    <Alert 
      variant={config.variant} 
      className="mb-4 relative"
      data-testid="alert-subscription-reminder"
    >
      <IconComponent className="h-4 w-4" />
      <AlertTitle data-testid="text-reminder-title">{config.title}</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
        <span data-testid="text-reminder-description">{config.description}</span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={onUpgrade}
            variant={config.variant === "destructive" ? "default" : "default"}
            data-testid="button-upgrade-reminder"
          >
            {config.buttonText}
          </Button>
          {config.canDismiss && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-6 w-6"
              data-testid="button-dismiss-reminder"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
