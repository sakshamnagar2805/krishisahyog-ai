import React from 'react';
import { Notice } from '../ui/Notice';

interface InformationOnlyBannerProps {
  message?: string;
  className?: string;
}

/** Reminder that the app gives guidance and does not file anything with the government */
export const InformationOnlyBanner: React.FC<InformationOnlyBannerProps> = ({
  message = 'KrishiSahyog explains services and helps you prepare. Claims, applications and complaints must be filed through the official portal or office.',
  className = '',
}) => (
  <Notice tone="info" className={className}>
    {message}
  </Notice>
);
