import type { TabId } from '../types';
import { FoodPage } from '../features/food/FoodPage';
import { StepsPage } from '../features/steps/StepsPage';
import { GymPage } from '../features/gym/GymPage';

/** Renders the page for the active tab. */
export function TabPanel({ tab }: { tab: TabId }) {
  return (
    <div id="tab-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === 'food' && <FoodPage />}
      {tab === 'steps' && <StepsPage />}
      {tab === 'gym' && <GymPage />}
    </div>
  );
}
