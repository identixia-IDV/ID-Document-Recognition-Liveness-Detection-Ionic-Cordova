import { useState } from 'react';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonToast,
  useIonViewWillEnter,
} from '@ionic/react';
import { getLicenseStatus } from 'document-reader-cordova';
import IdentixiaLogo from '../components/IdentixiaLogo';
import { ANDROID_APPLICATION_ID, IOS_BUNDLE_ID, resolveNativePlatform } from '../license';

export default function About() {
  const appId = resolveNativePlatform() === 'ios' ? IOS_BUNDLE_ID : ANDROID_APPLICATION_ID;
  const [licenseText, setLicenseText] = useState('License: …');
  const [presentToast] = useIonToast();

  useIonViewWillEnter(() => {
    getLicenseStatus()
      .then((status) => setLicenseText(`License: ${status.label}`))
      .catch(() => setLicenseText('License: No license'));
  });

  const onCopy = async () => {
    if (!appId) return;
    try {
      await navigator.clipboard.writeText(appId);
      presentToast({ message: 'Copied', duration: 1500, color: 'success' });
    } catch {
      presentToast({ message: 'Copy failed', duration: 1500, color: 'danger' });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="about-body">
          <div className="about-logo-row">
            <IdentixiaLogo size={96} />
            <div className="about-license-chip">{licenseText}</div>
          </div>

          <div className="about-machine-row">
            <div className="about-machine-code">{appId}</div>
            <button type="button" className="about-copy-btn" onClick={() => void onCopy()}>
              Copy
            </button>
          </div>

          <a
            className="about-site-link"
            href="https://identixia.com"
            target="_blank"
            rel="noreferrer"
          >
            identixia.com
          </a>
        </div>
      </IonContent>
    </IonPage>
  );
}
