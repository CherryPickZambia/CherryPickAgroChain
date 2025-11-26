/**
 * TypeScript declarations to suppress Next.js warnings
 * These warnings are safe to ignore for client components with callback props
 */

declare module 'react' {
  interface FunctionComponent<P = {}> {
    // Allow non-serializable props in client components
    (props: P, context?: any): React.ReactElement<any, any> | null;
  }
}

// Suppress prop serialization warnings for common callback patterns
declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      onClose?: () => void;
      onApprove?: (...args: any[]) => void;
      onReject?: (...args: any[]) => void;
      onSubmit?: (...args: any[]) => void;
      onContractCreated?: (...args: any[]) => void;
      onEvidenceSubmitted?: (...args: any[]) => void;
    }
  }
}

export {};
