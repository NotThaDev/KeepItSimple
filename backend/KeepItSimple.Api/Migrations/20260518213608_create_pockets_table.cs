using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace KeepItSimple.Api.Migrations
{
    /// <inheritdoc />
    public partial class create_pockets_table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Pockets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Balance = table.Column<decimal>(type: "numeric", nullable: false),
                    Currency = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Iban = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pockets", x => x.Id);
                });

            migrationBuilder.AddColumn<int>(
                name: "PocketId",
                table: "Transactions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Pockets_PocketId",
                table: "Transactions",
                column: "PocketId",
                principalTable: "Pockets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_PocketId",
                table: "Transactions",
                column: "PocketId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Pockets_PocketId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_PocketId",
                table: "Transactions");

            migrationBuilder.DropColumn(
                name: "PocketId",
                table: "Transactions");

            migrationBuilder.DropTable(
                name: "Pockets");
        }
    }
}
