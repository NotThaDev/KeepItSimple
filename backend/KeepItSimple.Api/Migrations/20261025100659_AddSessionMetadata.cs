using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KeepItSimple.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSessionMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "SessionCreatedAt",
                schema: "identity",
                table: "RefreshTokens",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "UserAgent",
                schema: "identity",
                table: "RefreshTokens",
                type: "character varying(512)",
                maxLength: 512,
                nullable: true);

            migrationBuilder.Sql("UPDATE identity.\"RefreshTokens\" SET \"SessionCreatedAt\" = \"CreatedAt\";");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SessionCreatedAt",
                schema: "identity",
                table: "RefreshTokens");

            migrationBuilder.DropColumn(
                name: "UserAgent",
                schema: "identity",
                table: "RefreshTokens");
        }
    }
}
