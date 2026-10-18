using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KeepItSimple.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordChangedAtToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Existing users start their expiration period at migration time, so nobody is locked out right away.
            migrationBuilder.AddColumn<DateTime>(
                name: "PasswordChangedAt",
                schema: "identity",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordChangedAt",
                schema: "identity",
                table: "AspNetUsers");
        }
    }
}
