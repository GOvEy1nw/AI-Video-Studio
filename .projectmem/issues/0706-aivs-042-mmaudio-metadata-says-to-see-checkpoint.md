# #0706 AIVS-042 MMAudio metadata says to see checkpoint metadata even though the upstream repository declares no weights licence

- 2026-08-08T16:45:34Z `issue`: AIVS-042 MMAudio metadata says to see checkpoint metadata even though the upstream repository declares no weights licence [backend/model_profiles/profiles.py]
- 2026-08-08T16:50:02Z `attempt`: Recorded MMAudio weights licensing as explicitly undeclared/unknown and added profile assertions [backend/model_profiles/profiles.py] (worked)
- 2026-08-08T16:50:11Z `fix`: MMAudio profile and notices now state that upstream weights licensing is undeclared and no rights are inferred [backend/model_profiles/profiles.py]
