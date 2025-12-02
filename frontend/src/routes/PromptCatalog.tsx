import { useTranslation } from 'react-i18next';
import PromptListPreview from '../features/prompts/PromptListPreview';

function PromptCatalog() {
  const { t } = useTranslation(['prompts', 'common']);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('prompts:title')}</h1>
          <p className="text-muted">{t('prompts:subtitle')}</p>
        </div>
        <button className="button" type="button">
          {t('common:actions.newPrompt')}
        </button>
      </div>
      <PromptListPreview />
    </div>
  );
}

export default PromptCatalog;
