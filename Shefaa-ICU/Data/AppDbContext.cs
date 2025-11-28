using Microsoft.EntityFrameworkCore;
using Shefaa_ICU.Models;

namespace Shefaa_ICU.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Patient> Patients { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<ClinicalNotes> ClinicalNotes { get; set; }
        public DbSet<AttendanceLog> AttendanceLogs { get; set; }
        public DbSet<Medication> Medications { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Vitals> Vitals { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(e => e.ID);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.HasIndex(e => e.Code).IsUnique();

                entity.HasOne(p => p.Room)
                    .WithOne(r => r.Patient)
                    .HasForeignKey<Patient>(p => p.RoomId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            modelBuilder.Entity<Room>(entity =>
            {
                entity.HasKey(e => e.ID);
                entity.Property(e => e.Number).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Number).IsUnique();
            });

            modelBuilder.Entity<Staff>(entity =>
            {
                entity.HasKey(e => e.ID);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            modelBuilder.Entity<Vitals>(entity =>
            {
                entity.HasKey(e => e.ID);

                entity.HasOne(v => v.Patient)
                    .WithMany(p => p.Vitals)
                    .HasForeignKey(v => v.PatientID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => new { e.PatientID, e.RecordedAt });
            });

            modelBuilder.Entity<Medication>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);

                entity.HasOne(m => m.Patient)
                    .WithMany(p => p.Medications)
                    .HasForeignKey(m => m.PatientID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.Staff)
                    .WithMany(s => s.Medications)
                    .HasForeignKey(m => m.AdministeredBy)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.PatientID);
            });

            modelBuilder.Entity<ClinicalNotes>(entity =>
            {
                entity.HasKey(e => e.ID);
                entity.Property(e => e.Text).IsRequired();

                entity.HasOne(c => c.Patient)
                    .WithMany(p => p.ClinicalNotes)
                    .HasForeignKey(c => c.PatientID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Staff)
                    .WithMany(s => s.ClinicalNotes)
                    .HasForeignKey(c => c.AuthorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<AttendanceLog>(entity =>
            {
                entity.HasKey(e => e.ID);

                entity.HasOne(a => a.Staff)
                    .WithMany(s => s.AttendanceLogs)
                    .HasForeignKey(a => a.StaffID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => new { e.StaffID, e.CheckInTime });
            });

            modelBuilder.Entity<Schedule>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(s => s.Staff)
                    .WithMany(st => st.Schedules)
                    .HasForeignKey(s => s.StaffID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => new { e.Date, e.ShiftType, e.StaffID });
            });

            modelBuilder.Entity<Notification>(entity =>
            {
                entity.HasKey(e => e.ID);

                entity.HasOne(n => n.Staff)
                    .WithMany(s => s.Notifications)
                    .HasForeignKey(n => n.StaffID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => new { e.StaffID, e.IsRead, e.CreatedAt });
            });
        }
    }
}