"use client";

import { forwardRef } from 'react';
import dynamic from 'next/dynamic';
import GlobeLoader from './globe-loader';

const GlobeGL = dynamic(() => import('./globe-component'), {
  ssr: false,
  loading: () => <GlobeLoader />
});

interface GlobeWrapperProps {
  [key: string]: any;
}

const GlobeWrapper = forwardRef<any, GlobeWrapperProps>((props, ref) => {
  return <GlobeGL ref={ref} {...props} />;
});

GlobeWrapper.displayName = 'GlobeWrapper';

export default GlobeWrapper;