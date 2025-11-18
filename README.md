# Shefaa (ICU Management System)

This repository hosts the Shefaa ICU Management experience in two layers:

- **`Shefaa-ICU/`** – ASP.NET Core 8 MVC project with Entity Framework Core models, migrations, and Razor views mirroring the original UI.
- **`Docs/`** – Software requirements, SRS assets, and design references supplied by the client.

## Front-end Template in Razor

The UI previously delivered as static HTML/CSS/JS has been recreated as Razor views and partials so you can plug in real data later:

- Shared layouts for auth screens and the main application shell.
- Reusable sidebar and top navigation partials.
- Views for dashboard, patients (list + detail), rooms, staff, schedules, reports, and user profile.
- Auth pages (`Home/Index`, `Home/Signup`) reuse the same markup as the original login/register screens.
- Each dynamic region includes Razor comments describing which backend data/services should power it.

All static assets (CSS, JS, fonts) live under `Shefaa-ICU/wwwroot` and match the eye-comfortable palette plus UX tweaks that were approved earlier.

## Getting Started

```bash
cd Shefaa-ICU
dotnet restore
dotnet ef database update   # optional, if SQL Server LocalDB is available
dotnet run
```

The project currently runs with placeholder data (localStorage stubs) until the backend endpoints are implemented. Use the Razor annotations as a guide when wiring controllers, services, and EF Core queries.

## Next Steps

1. Implement controllers for Patients, Rooms, Staff, Schedules, Reports, and Dashboard summaries.
2. Replace localStorage mocks with database reads/writes via `AppDbContext`.
3. Plug in real authentication (ASP.NET Identity) and authorization for staff roles.
4. Populate the notification center, charts, and export actions with real data pipelines.

Feel free to open an issue or reach out if you need help connecting any module to the backend.***

