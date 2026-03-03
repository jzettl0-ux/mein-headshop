/**
 * Standard-Vorlage für den Mitarbeitervertrag (site_settings key: employee_contract_template).
 * Wird verwendet, wenn noch keine Vorlage gespeichert wurde.
 * Platzhalter: company_*, represented_by, start_date, employee_name, employee_address,
 * job_title, working_hours_week, salary_brutto, account_holder, bank_name, employee_iban, employee_bic, probezeit_monate.
 */
export const DEFAULT_EMPLOYEE_CONTRACT_TEMPLATE = `ARBEITSVERTRAG (Muster – bitte anpassen und rechtlich prüfen lassen)

Zwischen

{{company_name}}
{{company_address}}
{{company_postal_code}} {{company_city}}
vertreten durch {{represented_by}}

– nachfolgend „Arbeitgeber“ –

und

Name: {{employee_name}}
Adresse: {{employee_address}}

– nachfolgend „Arbeitnehmer/in“ –

wird folgender Arbeitsvertrag geschlossen.

§ 1 Beginn und Probezeit
Der Arbeitsvertrag beginnt am {{start_date}}. Es gilt eine Probezeit von {{probezeit_monate}} Monaten.

§ 2 Tätigkeit
Der/die Arbeitnehmer/in wird als {{job_title}} beschäftigt.

§ 3 Arbeitszeit
Die regelmäßige wöchentliche Arbeitszeit beträgt {{working_hours_week}} Stunden. Es gilt die betriebliche Arbeitszeitregelung.

§ 4 Vergütung
Die monatliche Bruttovergütung beträgt {{salary_brutto}} € und wird jeweils zum Monatsende gezahlt.

§ 5 Gehaltszahlung / Konto
Die Vergütung wird auf folgendes Konto des/der Arbeitnehmer/in überwiesen:
Kontoinhaber: {{account_holder}}
Bank: {{bank_name}}
IBAN: {{employee_iban}}
BIC: {{employee_bic}}

Der/die Arbeitnehmer/in teilt Änderungen der Bankverbindung unverzüglich schriftlich mit.

§ 6 Urlaub
Der/die Arbeitnehmer/in hat Anspruch auf den gesetzlichen Erholungsurlaub (mind. 20 Werktage bei 5-Tage-Woche).

§ 7 Verschwiegenheit und Datenschutz
Der/die Arbeitnehmer/in verpflichtet sich zur Verschwiegenheit über betriebliche und persönliche Angelegenheiten. Die Verarbeitung personenbezogener Daten erfolgt im Einklang mit der DSGVO.

§ 8 Vertragslaufzeit und Kündigung
Das Arbeitsverhältnis wird auf unbestimmte Zeit geschlossen. Es gelten die gesetzlichen Kündigungsfristen.

§ 9 Schlussbestimmungen
Änderungen und Ergänzungen bedürfen der Schriftform. Gerichtsstand ist der Sitz des Arbeitgebers.

___________________________ (Ort, Datum)    ___________________________ (Arbeitgeber)

___________________________ (Arbeitnehmer/in)
`
