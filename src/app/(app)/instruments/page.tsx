import { Settings } from 'lucide-react';
import { getInstruments } from '@/actions/instrumentActions';
import { PageHeader } from '@/components/shared/page-header';
import { InstrumentTableClient } from '@/components/instruments/instrument-table-client';

export const dynamic = 'force-dynamic';

export default async function InstrumentsPage() {
  const instruments = await getInstruments();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Instrument Management"
        description="Manage all tradable instruments and symbols."
        icon={Settings}
      />
      <InstrumentTableClient initialInstruments={instruments} />
    </div>
  );
}
