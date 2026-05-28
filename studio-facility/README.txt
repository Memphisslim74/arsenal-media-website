StudioOps Command Center v8

Files:
- index.html: single-file Cloudflare Pages app
- supabase-schema.sql: starter Supabase schema and demo policies

Quick start:
1. Create a Supabase project.
2. Open Supabase > SQL Editor.
3. Paste and run supabase-schema.sql.
4. The app is already configured for this Supabase project:
   - https://kzuqfhcflfopmodglqzl.supabase.co
5. Deploy index.html to Cloudflare Pages.
6. Open the app.
7. Click Load Work Orders on the dashboard, or click the database status pill to test/re-save the connection.
8. Create a new work order to test database inserts.

This version still works without Supabase in Demo Mode.


Note: This app uses the public/publishable Supabase key only. Do not put a service_role key in index.html.


v16 update:
- Adds work order file/photo upload support using Supabase Storage bucket work-order-files.
- Re-run supabase-schema.sql to create the storage bucket and demo storage policies.
- Adds mobile/responsive modal and layout polish.


v18 stable recovery:
- Rolled back to the stable v16 UI.
- Keeps Supabase preconfigured.
- Work orders still save to Supabase when creating records.
- Admin Settings has safer DB tools.
- Avoids aggressive DB-first removal until each module is converted safely.


v19 update:
- Work Orders are now database-first.
- The app loads work orders from Supabase on startup.
- New work orders save to Supabase, then reload from Supabase.
- If Supabase has no work orders, the app shows an empty state instead of fake work orders.
- Other modules remain stable and will be converted one at a time.


v20 update:
- Restored Work Order Detail view for DB-backed work orders.
- Added comments, time, costs, and attachments on the detail page.
- Dashboard stat cards now link to the corresponding modules.
- Added a starter All Team workspace based on current work order assignees.


v23 stable route-only recovery:
- Rolled back to the last stable v20 build.
- Added route persistence only.
- Refreshing a screen should keep the user on that screen.
- No dummy data removal was attempted in this version.
- Next step should be converting one module at a time, starting with Work Orders only.


v24 update:
- Fixed Supabase warning about multiple GoTrueClient instances.
- Supabase client is now cached and reused instead of recreated repeatedly.
- Disabled auth session persistence for this tester build until real login/roles are added.


v25 update:
- Locations module is now DB-backed.
- Added Create Location modal.
- Locations save to Supabase.
- Locations reload from Supabase.
- Create Work Order location dropdown uses DB locations when available.
- Other modules were left untouched for stability.


v26 update:
- Removed the unused fallback/demo locations block from the app.
- Added supabase-clean-demo-data.sql to remove old seeded demo records from Supabase.
- If old demo locations appear after creating a real location, run the cleanup SQL once.


v27 cleanup SQL fix:
- Replaced cleanup SQL with a safer version.
- Uses single-quoted text arrays.
- Fixes Postgres errors like relation "Props" does not exist.


v28 cleanup SQL fix:
- Cleanup SQL no longer contains the word that Supabase/Postgres was reading as a relation.
- Run supabase-clean-demo-data.sql exactly as included.


v29 update:
- Locations can now be edited.
- Locations can now be deleted.
- The existing location modal supports both create and edit.
- Delete asks for confirmation, and warns if open work orders reference the location name.


v30 update:
- Locations now auto-load from Supabase on app startup.
- Users no longer need to click Reload/Load Locations first.
- Startup loads Work Orders first, then Locations, then renders the current route.


v31 update:
- Asset Management module is now DB-backed.
- Added Create Asset modal.
- Added Edit Asset.
- Added Delete Asset with confirmation.
- Assets auto-load from Supabase on startup.
- Create Work Order asset dropdown uses DB assets when available.


v32 update:
- Asset form now supports quick-add Location directly from the asset modal.
- Asset form now supports quick-add Vendor directly from the asset modal.
- Vendor dropdown loads from Supabase vendors table.
- Quick-added vendors save to Supabase.
- Quick-added locations save to Supabase and immediately populate the asset form.


v33 update:
- Any field asking for date/time now uses native date or datetime pickers.
- Work Order Due Date / Time uses datetime-local.
- Location Next Walk uses datetime-local.
- Asset Next PM uses date picker.
- Asset Warranty Expiration uses date picker.
- Picker values are formatted into readable display text when saved.


v34 update:
- Added Field Settings page for editable dropdown values.
- Added DB-backed lookup_options table in supabase-schema.sql.
- Asset Status and Asset Criticality can now be added from the Asset modal.
- Location Status and Location Readiness can now be added from the Location modal.
- Field Settings page manages Asset Status, Asset Criticality, Work Order Status, Work Order Priority, Location Status, and Location Readiness.
- Run the updated supabase-schema.sql once to create and seed lookup_options.


v35 update:
- Vendor Management is now DB-backed.
- Added Create Vendor modal.
- Added Edit Vendor.
- Added Delete Vendor.
- Vendors auto-load from Supabase and populate asset vendor dropdowns.
- Removed visible demo vendor records from the Vendors module.


v36 update:
- Inventory module is now DB-backed.
- Added Create Inventory Item.
- Added Edit Inventory Item.
- Added Delete Inventory Item.
- Inventory auto-loads from Supabase.
- Removed visible demo inventory data.
- Updated supabase-schema.sql to include inventory_items if missing.


v37 update:
- Purchase Orders are now DB-backed.
- Added Create Purchase Order.
- Added Edit Purchase Order.
- Added Delete Purchase Order.
- Purchase Orders auto-load from Supabase.
- Removed visible demo Purchase Order data.
- Updated supabase-schema.sql to include purchase_orders if missing.


v38 update:
- Fixed refresh persistence for Purchase Orders.
- Startup loader now loads every converted DB-backed module:
  Work Orders, Locations, Assets, Vendors, Field Settings, Inventory, and Purchase Orders.
- Saving Supabase settings now reloads all converted DB modules.


v39 update:
- Work Order Time Tracking is now DB-backed.
- Added Create Time Entry.
- Added Edit Time Entry.
- Added Delete Time Entry.
- Time entries can be tied to work orders.
- Time entries auto-load from Supabase.
- Removed visible demo time tracking data.
- Cleared old demo time/cost/file arrays from work order detail.


v40 update:
- Fixed Time Tracking refresh persistence.
- Startup now loads time_entries every time the app opens or refreshes.
- Cleaned up an accidental comma-chain in the purchase order delete refresh logic.


v41 update:
- Costs module is now DB-backed.
- Added Create Cost Entry.
- Added Edit Cost Entry.
- Added Delete Cost Entry.
- Cost entries can be tied to work orders.
- Costs auto-load from Supabase on refresh.
- Removed visible demo cost data.


v42 update:
- Meters module is now DB-backed.
- Added Create Meter.
- Added Edit Meter.
- Added Delete Meter.
- Meters can be tied to locations.
- Meters auto-load from Supabase on refresh.
- Removed visible demo meter data.


v43 update:
- Removed the old Demo seed data block from supabase-schema.sql.
- Future schema reruns should no longer reinsert demo locations, work orders, assets, or vendors.
- Added supabase-clean-demo-data.sql to remove demo rows already reinserted into Supabase.


v44 update:
- Hard-removed any operational seed inserts from supabase-schema.sql.
- Added hard cleanup for screenshot demo locations such as Backlot North Road, Bldg E, Bungalows, Mill, and Pump House.
- Added supabase-verify-no-demo-data.sql to confirm demo records are gone.
- Use the SQL files in this order:
  1. supabase-schema.sql only when schema changes are needed
  2. supabase-clean-demo-data.sql if demo rows exist
  3. supabase-verify-no-demo-data.sql to confirm cleanup


v46 update:
- Downtime module is now DB-backed.
- Added Create Downtime.
- Added Edit Downtime.
- Added Delete Downtime.
- Downtime can be tied to locations and assets.
- Downtime auto-loads from Supabase on refresh.
- Removed visible demo downtime data.


v47 update:
- Preventive Maintenance module is now DB-backed.
- Added Create PM Template.
- Added Edit PM Template.
- Added Delete PM Template.
- Create WO from PM now saves a real Supabase work order.
- PM templates auto-load from Supabase on refresh.
- Removed visible demo PM/procedure data.


v48 update:
- Replaced startup loader with a complete explicit module hydration list.
- Fixed Downtime refresh persistence.
- Added safety hydration for direct route refreshes on converted modules.


v49 update:
- PM module is now visibly labeled as Preventive Maintenance in the sidebar.


v50 update:
- All Team module is now DB-backed.
- Added Create Team Member.
- Added Edit Team Member.
- Added Delete Team Member.
- Team auto-loads from Supabase on refresh.
- Removed visible demo team members.


v51 update:
- Fixed Team reload persistence with explicit startup hydration.


v52 update:
- Cleaned remaining hardcoded demo leftovers.
- Daily Lot Walk no longer defaults to Stage A.
- Fallback demo assets and comments removed.


v54 update:
- Safely hid the Meters module from navigation only.
- Underlying code remains unused but intact for stability.


v55 update:
- Work Order detail now has an Activity Hub.
- Activity feed supports comments, image/file uploads, and attachment gallery.
- Deploy ZIP contains no SQL files.


v56 update:
- Fixed Work Order detail layout so desktop no longer stacks everything on one side.
- Improved responsive behavior for the Work Order page.


v57 update:
- Reporting module now uses real app data instead of demo metrics.


v59 update:
- Safe copy cleanup from the working v57 build.
- Avoided broad text replacements that could break JavaScript/config.


v60 update:
- Fixed Work Order detail status button.


v62 update:
- Work Orders now has multiple views.
- Board and Calendar support drag/drop changes.


v63 update:
- Work Order views dropdown refined for smaller screens and mobile use.


v64 update:
- Calendar supports both Week and Month views.
