using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Shefaa_ICU.Migrations
{
    /// <inheritdoc />
    public partial class AddProfilePhotoPathToStaff : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfilePhotoPath",
                table: "Staff",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfilePhotoPath",
                table: "Staff");
        }
    }
}

