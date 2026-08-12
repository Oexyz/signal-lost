# Production checklist

Production release is blocked until every applicable item has been verified against the actual deployment.

## Legal review

- [ ] Operator name is complete.
- [ ] A full service address is complete.
- [ ] A contact email address is complete.
- [ ] Applicable legal form, representative, register, register number, and VAT information are complete.
- [ ] Editorial responsibility under applicable media law has been reviewed.
- [ ] German Impressum and Datenschutz pages match the operator and implementation.
- [ ] Current German and European legal requirements have been reviewed using official sources.
- [ ] Support wording and any external support destination have been reviewed.
- [ ] Horror content and applicable youth-protection requirements have been reviewed.

## Privacy and assets

- [ ] Hosting, logs, processors, retention, deletion, and backups match the privacy data map.
- [ ] Browser cookies and storage have been inspected manually.
- [ ] Production browser network tests permit only project-controlled origins.
- [ ] Fonts, images, audio, video, and dependency licenses have been reviewed.
- [ ] No analytics, advertising, tracking, remote embeds, or runtime CDN dependency is present.

## Security and operation

- [ ] HTTPS, certificates, security headers, and explicit origins are configured.
- [ ] Production secrets use an approved secret-management design.
- [ ] Database access is private and migrations were tested from a clean database.
- [ ] Rate limits, WebSocket validation, replay protection, and payload limits are verified.
- [x] A private vulnerability-reporting route is documented.
- [ ] Monitoring measures service health without profiling individual players.

Run `pnpm release:check` after configuration. Automated checks do not replace manual review.
