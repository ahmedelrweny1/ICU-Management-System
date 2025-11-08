using Microsoft.EntityFrameworkCore;
using Shefaa.ICU.Web.Models;

namespace Shefaa.ICU.Web.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Patient> Patients { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Schedule> Schedules { get; set; }
        public DbSet<Activity> Activities { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Patient
            modelBuilder.Entity<Patient>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.OwnsOne(e => e.Vitals);
                entity.OwnsMany(e => e.Drugs);
                entity.OwnsMany(e => e.Notes);
            });

            // Configure Room
            modelBuilder.Entity<Room>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure Staff
            modelBuilder.Entity<Staff>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure Schedule
            modelBuilder.Entity<Schedule>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed Rooms
            modelBuilder.Entity<Room>().HasData(
                new Room { Id = 101, Status = "Occupied", PatientId = "P12345" },
                new Room { Id = 102, Status = "Occupied", PatientId = "P67890" },
                new Room { Id = 103, Status = "Occupied", PatientId = "P11223" },
                new Room { Id = 104, Status = "Occupied", PatientId = "P45678" },
                new Room { Id = 105, Status = "Available", PatientId = null },
                new Room { Id = 106, Status = "Available", PatientId = null }
            );
        }
    }
}

