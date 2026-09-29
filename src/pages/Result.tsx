import { useMemo, useState } from 'react';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonViewWillEnter,
} from '@ionic/react';
import { images, pretty } from 'document-reader-cordova';
import { getRecognizeResult } from '../resultStore';
import {
  checkGroups,
  fieldGroups,
  identityView,
  kindLabel,
  overallViews,
  resultStatusClass,
  sourceLabel,
} from '../resultViews';

export default function Result() {
  const [json, setJson] = useState(() => getRecognizeResult());

  useIonViewWillEnter(() => {
    setJson(getRecognizeResult());
  });

  const ident = useMemo(() => identityView(json), [json]);
  const overallRows = useMemo(() => overallViews(json), [json]);
  const fieldRows = useMemo(() => fieldGroups(json), [json]);
  const checkRows = useMemo(() => checkGroups(json), [json]);
  const imgs = useMemo(() => images(json), [json]);
  const rawText = useMemo(() => pretty(json), [json]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Result</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="result-scroll">
          <div className="result-identity">
            <h3 className="result-ident-title">{ident.title}</h3>
            <p className="result-ident-status">
              <strong>{ident.status.split(' ·')[0]}</strong>
              {ident.status.includes(' ·')
                ? ident.status.slice(ident.status.indexOf(' ·'))
                : ''}
            </p>
            <p className="result-ident-counts">{ident.counts}</p>
          </div>

          <h2 className="result-section-title">Overall</h2>
          {overallRows.map((r) => (
            <div key={r.kind} className="result-overall-row">
              <span className="col-val">{kindLabel(r.kind)}</span>
              <span className={resultStatusClass(r.result)}>{r.result}</span>
            </div>
          ))}

          <h2 className="result-section-title">Fields</h2>
          {fieldRows.length === 0 ? (
            <p className="result-empty">No fields in this response.</p>
          ) : (
            fieldRows.map((group) => (
              <div key={group.source} className="result-group">
                <div className="result-group-head">
                  <span className="ix-pill">{sourceLabel(group.source)}</span>
                  <span className="ix-count">{group.items.length}</span>
                </div>
                {group.items.map((item, i) => (
                  <div key={`${item.id}-${i}`} className="result-item">
                    <div className="result-label">{item.id}</div>
                    <div className="col-val result-value">{item.value}</div>
                    {item.score ? <div className="result-extra">{item.score}</div> : null}
                  </div>
                ))}
              </div>
            ))
          )}

          <h2 className="result-section-title">Checks</h2>
          {checkRows.length === 0 ? (
            <p className="result-empty">No checks in this response.</p>
          ) : (
            checkRows.map((group) => (
              <div key={group.kind} className="result-group">
                <div className="result-group-head">
                  <span className="ix-pill">{kindLabel(group.kind)}</span>
                  <span className="ix-count">{group.items.length}</span>
                </div>
                {group.items.map((item, i) => (
                  <div key={`${item.id}-${i}`} className="result-item">
                    <div className="result-check">
                      <span className="col-val">{item.id}</span>
                      <span className={resultStatusClass(item.result)}>{item.result}</span>
                    </div>
                    {item.extra ? <div className="result-extra">{item.extra}</div> : null}
                  </div>
                ))}
              </div>
            ))
          )}

          <h2 className="result-section-title">Images</h2>
          {imgs.length === 0 ? (
            <p className="result-empty">No images in response.</p>
          ) : (
            <div className="result-img-strip">
              {imgs.map((img, i) => (
                <figure key={`${img.category}-${i}`} className="result-img-item">
                  <img src={img.uri} alt={img.category} />
                  <figcaption className="result-img-caption">
                    {img.category}
                    {img.source ? ` · ${img.source}` : ''}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}

          <details className="result-raw-drawer">
            <summary>Raw JSON</summary>
            <pre className="result-raw">{rawText}</pre>
          </details>
        </div>
      </IonContent>
    </IonPage>
  );
}
