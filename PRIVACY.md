# Privacy

This document describes the current development implementation of SIGNAL//LOST. It is not legal advice or a compliance certification.

## Current browser behavior

The Phase 0 browser application:

- does not require an account;
- does not load advertising or behavioral analytics;
- does not load remote fonts, images, scripts, stylesheets, or embedded media;
- does not request camera, microphone, geolocation, payment, or screen-capture access;
- does not use cookies, local storage, session storage, IndexedDB, or a service worker.

Ordinary external navigation may be added only after the destination exists and has been reviewed. Merely opening a SIGNAL//LOST page must not contact that destination.

## Current server behavior

The Phase 0 server exposes health endpoints and the first local protocol boundary. It does not provide public accounts, matchmaking, file uploads, or a production persistence service.

Technical development logs are limited to service operation. Session secrets, authorization headers, complete private decisions, canonical scenario secrets, and full player content must not be logged.

## Planned multiplayer data

Future invite-only sessions are expected to process temporary nicknames, random room identifiers, connection/session identifiers, game events, and evidence-board text. Those categories are not considered implemented until code and the [privacy data map](docs/PRIVACY_DATA_MAP.md) are updated together.

## Production review

Hosting, processors, retention periods, deletion procedures, legal bases, operator contact details, and the final German privacy notice require manual review before any public deployment. The production release check must remain blocked until applicable operator information is complete.
