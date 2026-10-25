TITLE:
How Aadhaar Works | Deep-Dive Technical Explainer

DESCRIPTION:
Learn how Aadhaar works under the hood through zero-knowledge authentication, Verhoeff checksums, multi-modal ABIS de-duplication, AES-256 envelope encryption, and resident privacy shields.

HASHTAGS:
#Technology #Cybersecurity #Aadhaar #SystemDesign #TechShorts

FACTS TO VERIFY BEFORE PUBLISHING:
- Aadhaar first digit cannot be 0 or 1
- 12th digit calculated via Verhoeff checksum (D5 dihedral group)
- Envelope encryption uses AES-256 and RSA-2048
- Enrolment client requires operator biometric login
- Multi-modal ABIS compares 10 fingerprints and 2 irises across 1.4B+ records
- Banks (AUA) and ASAs receive only encrypted packets and cannot decrypt biometrics
- Registered Devices encrypt at capture with replay protection via UTC timestamp and txn ID
- Resident privacy shields include 16-digit VID, masked Aadhaar, and biometric lock
