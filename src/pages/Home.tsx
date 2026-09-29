import { useState } from 'react';
import {
  IonContent,
  IonIcon,
  IonPage,
  useIonAlert,
  useIonViewWillEnter,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  cameraOutline,
  imagesOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { getLicenseStatus, stopLivePreview } from 'document-reader-cordova';
import { useSdk } from '../SdkContext';

export default function Home() {
  const { status, ready } = useSdk();
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [licenseText, setLicenseText] = useState('License: …');

  useIonViewWillEnter(() => {
    void stopLivePreview().catch(() => undefined);
    document.documentElement.classList.remove('frs-live-camera');
    getLicenseStatus()
      .then((s) => setLicenseText(`License: ${s.label}`))
      .catch(() => setLicenseText('License: No license'));
  });

  const guard = (go: () => void) => {
    if (!ready) {
      presentAlert({ header: 'SDK is not ready', message: status, buttons: ['OK'] });
      return;
    }
    go();
  };

  const readyClass = ready
    ? 'ok'
    : status.toLowerCase().includes('loading')
      ? 'info'
      : 'error';

  const readyLabel = ready ? 'Ready' : status.split(':')[0].slice(0, 12);

  return (
    <IonPage>
      <IonContent className="home-page">
        <div className="home-body">
          <div className="home-top-row">
            <div className="home-chip">{licenseText}</div>
            <div className={`home-ready ${readyClass}`}>{readyLabel}</div>
          </div>

          <button
            type="button"
            className="home-camera-wide"
            disabled={!ready}
            onClick={() => guard(() => history.push('/camera'))}
          >
            <IonIcon icon={cameraOutline} />
            Camera
          </button>

          <div className="home-secondary-row">
            <button
              type="button"
              className="home-secondary-tile"
              disabled={!ready}
              onClick={() => guard(() => history.push('/gallery'))}
            >
              <IonIcon icon={imagesOutline} />
              Gallery
            </button>
            <button
              type="button"
              className="home-secondary-tile"
              onClick={() => history.push('/about')}
            >
              <IonIcon icon={informationCircleOutline} />
              About
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
