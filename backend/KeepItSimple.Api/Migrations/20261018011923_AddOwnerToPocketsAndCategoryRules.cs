using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KeepItSimple.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOwnerToPocketsAndCategoryRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Pockets",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "CategoryRules",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pockets_UserId",
                table: "Pockets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryRules_UserId",
                table: "CategoryRules",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CategoryRules_AspNetUsers_UserId",
                table: "CategoryRules",
                column: "UserId",
                principalSchema: "identity",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Pockets_AspNetUsers_UserId",
                table: "Pockets",
                column: "UserId",
                principalSchema: "identity",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CategoryRules_AspNetUsers_UserId",
                table: "CategoryRules");

            migrationBuilder.DropForeignKey(
                name: "FK_Pockets_AspNetUsers_UserId",
                table: "Pockets");

            migrationBuilder.DropIndex(
                name: "IX_Pockets_UserId",
                table: "Pockets");

            migrationBuilder.DropIndex(
                name: "IX_CategoryRules_UserId",
                table: "CategoryRules");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Pockets");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "CategoryRules");
        }
    }
}
