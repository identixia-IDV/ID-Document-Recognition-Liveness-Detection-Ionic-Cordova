import { useState } from 'react';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { recognize } from 'document-reader-cordova';
import { useHistory } from 'react-router-dom';
import { displayUri, pickGalleryPhoto } from '../pickImage';
import { basename } from '../resultViews';
import { setRecognizeResult } from '../resultStore';

export default function Gallery() {
  const history = useHistory();
  const [front, setFront] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null);
  const [frontName, setFrontName] = useState('Front');
  const [backName, setBackName] = useState('Back (optional)');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (side: 'front' | 'back') => {
    setError('');
    try {
      const uri = await pickGalleryPhoto();
      const name = basename(uri);
      if (side === 'front') {
        setFront(uri);
        setFrontName(name);
      } else {
        setBack(uri);
        setBackName(name);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const clear = (side: 'front' | 'back') => {
    if (side === 'front') {
      setFront(null);
      setFrontName('Front');
    } else {
      setBack(null);
      setBackName('Back (optional)');
    }
  };

  const onRecognize = async () => {
    if (!front || busy) return;
    setBusy(true);
    setError('');
    try {
      const json = await recognize(front, back);
      setRecognizeResult(json);
      history.replace('/result');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Gallery</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="gallery-page">
        <div className="gallery-body">
          <div className="gallery-strip">
            <div className="gallery-slot">
              <div
                className="gallery-tile"
                role="button"
                tabIndex={0}
                onClick={() => void pick('front')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') void pick('front');
                }}
              >
                {front ? (
                  <img src={displayUri(front) ?? front} alt="Front" />
                ) : (
                  <span className="gallery-tile-placeholder">Front</span>
                )}
                {front && (
                  <button
                    type="button"
                    className="gallery-clear-x"
                    aria-label="Clear front"
                    onClick={(e) => {
                      e.stopPropagation();
                      clear('front');
                    }}
                  >
                    x
                  </button>
                )}
              </div>
              <div className="gallery-filename">{frontName}</div>
            </div>

            <div className="gallery-slot">
              <div
                className="gallery-tile"
                role="button"
                tabIndex={0}
                onClick={() => void pick('back')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') void pick('back');
                }}
              >
                {back ? (
                  <img src={displayUri(back) ?? back} alt="Back" />
                ) : (
                  <span className="gallery-tile-placeholder">Back</span>
                )}
                {back && (
                  <button
                    type="button"
                    className="gallery-clear-x"
                    aria-label="Clear back"
                    onClick={(e) => {
                      e.stopPropagation();
                      clear('back');
                    }}
                  >
                    x
                  </button>
                )}
              </div>
              <div className="gallery-filename">{backName}</div>
            </div>

            <button
              type="button"
              className="gallery-recognize-tile"
              disabled={!front || busy}
              onClick={() => void onRecognize()}
            >
              {busy ? <IonSpinner name="crescent" /> : 'Recognize'}
            </button>
          </div>

          {error && <p className="error-text">{error}</p>}
        </div>
      </IonContent>
    </IonPage>
  );
}
