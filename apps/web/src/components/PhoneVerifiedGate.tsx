import { Outlet } from 'react-router-dom';
import { useMe } from '../hooks/queries';
import { Spinner } from './Spinner';
import { ErrorBanner } from './ErrorBanner';
import PhoneVerifyOnboarding from './PhoneVerifyOnboarding';

export default function PhoneVerifiedGate() {
  const me = useMe();

  if (me.isLoading) {
    return (
      <div className="page-loader">
        <Spinner label="Checking your numbers…" />
      </div>
    );
  }

  if (me.error) {
    return (
      <div className="page-loader">
        <div className="card">
          <ErrorBanner message={me.error.message} />
          <button type="button" className="btn btn-primary" onClick={() => void me.refetch()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const verified = (me.data?.phoneNumbers ?? []).some((p) => p.verified);
  if (!verified) {
    return <PhoneVerifyOnboarding />;
  }

  return <Outlet />;
}