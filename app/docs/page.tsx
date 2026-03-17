'use client';

import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';

export default function ApiDocsPage() {
  return (
    <div style={{ height: '100vh', margin: 0, padding: 0 }}>
      <ApiReferenceReact
        configuration={{
          url: '/api/openapi.json',
        }}
      />
    </div>
  );
}
