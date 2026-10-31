using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KeepItSimple.Api.Migrations
{
    /// <inheritdoc />
    public partial class ConfirmExistingUsersEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Accounts created before email confirmation existed would otherwise be locked out.
            migrationBuilder.Sql("UPDATE identity.\"AspNetUsers\" SET \"EmailConfirmed\" = true WHERE \"EmailConfirmed\" = false;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
