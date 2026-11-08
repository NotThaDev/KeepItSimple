using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace KeepItSimple.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    Key = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Name = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Kind = table.Column<int>(type: "integer", nullable: false),
                    Group = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Icon = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Categories_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalSchema: "identity",
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Color", "Group", "Icon", "Key", "Kind", "Name", "UserId" },
                values: new object[,]
                {
                    { 1, "#8B5E3C", "Food & Drink", "Utensils", "Coffe", 0, "Coffe", null },
                    { 2, "#4CAF50", "Food & Drink", "Utensils", "Food", 0, "Food", null },
                    { 3, "#2196F3", "Transport", "Car", "Transport", 0, "Transport", null },
                    { 4, "#0D9488", "Leisure", "Ticket", "Entertainment", 0, "Entertainment", null },
                    { 5, "#FF9800", "Home", "Home", "Utilities", 0, "Utilities", null },
                    { 6, "#BE185D", "Shopping", "ShoppingBag", "Shopping", 0, "Shopping", null },
                    { 7, "#EF4444", "Health", "HeartPulse", "Health", 0, "Health", null },
                    { 8, "#1E3A8A", "Education", "GraduationCap", "Education", 0, "Education", null },
                    { 9, "#0EA5E9", "Leisure", "Ticket", "Travel", 0, "Travel", null },
                    { 10, "#06B6D4", "Health", "HeartPulse", "Sports", 0, "Sports", null },
                    { 11, "#A16207", "Bills", "Receipt", "Subscriptions", 0, "Subscriptions", null },
                    { 12, "#14B8A6", "Money", "Wallet", "Savings", 2, "Savings", null },
                    { 13, "#10B981", "Money", "Wallet", "Investments", 2, "Investments", null },
                    { 14, "#EC4899", "Giving", "Gift", "Gifts", 0, "Gifts", null },
                    { 15, "#F43F5E", "Giving", "Gift", "Love", 0, "Love", null },
                    { 16, "#22C55E", "Giving", "Gift", "Charity", 0, "Charity", null },
                    { 17, "#15803D", "Work", "Briefcase", "Salary", 1, "Salary", null },
                    { 18, "#65A30D", "Work", "Briefcase", "Bonus", 1, "Bonus", null },
                    { 19, "#0F766E", "Work", "Briefcase", "Freelance", 1, "Freelance", null },
                    { 20, "#1D4ED8", "Work", "Briefcase", "Business", 1, "Business", null },
                    { 21, "#3F6212", "Investments", "TrendingUp", "Interest", 1, "Interest", null },
                    { 22, "#0891B2", "Investments", "TrendingUp", "Dividends", 1, "Dividends", null },
                    { 23, "#475569", "Property", "Building2", "RentalIncome", 1, "Rental Income", null },
                    { 24, "#38BDF8", "Other", "MoreHorizontal", "Refund", 1, "Refund", null },
                    { 25, "#9E9E9E", "Other", "MoreHorizontal", "Other", 0, "Other", null },
                    { 26, "#F59E0B", "Transport", "Car", "Car", 0, "Car", null },
                    { 27, "#7C3AED", "Shopping", "ShoppingBag", "Clothing", 0, "Clothing", null },
                    { 28, "#C026D3", "Shopping", "ShoppingBag", "Accessories", 0, "Accessories", null },
                    { 29, "#B45309", "Home", "Home", "Furniture", 0, "Furniture", null },
                    { 30, "#92400E", "Home", "Home", "Home", 0, "Home", null },
                    { 31, "#64748B", "Leisure", "Ticket", "Newsstand", 0, "Newsstand", null },
                    { 32, "#DB2777", "Leisure", "Ticket", "Events", 0, "Events", null },
                    { 33, "#4338CA", "Shopping", "ShoppingBag", "Computers", 0, "Computers", null },
                    { 34, "#0E7490", "Leisure", "Ticket", "Hotel", 0, "Hotel", null },
                    { 35, "#1D4ED8", "Education", "GraduationCap", "School", 0, "School", null },
                    { 36, "#9A3412", "Education", "GraduationCap", "Books", 0, "Books", null },
                    { 37, "#1F2937", "Transport", "Car", "Motorcycle", 0, "Motorcycle", null },
                    { 38, "#7E22CE", "Leisure", "Ticket", "Music", 0, "Music", null },
                    { 39, "#047857", "Health", "HeartPulse", "Gym", 0, "Gym", null },
                    { 40, "#E11D48", "Health", "HeartPulse", "Hairdresser", 0, "Hairdresser", null },
                    { 41, "#A21CAF", "Health", "HeartPulse", "Personal", 0, "Personal", null },
                    { 42, "#EA580C", "Home", "Home", "Repairs", 0, "Repairs", null },
                    { 43, "#BE185D", "Giving", "Gift", "Relationships", 0, "Relationships", null },
                    { 44, "#0369A1", "Bills", "Receipt", "Services", 0, "Services", null },
                    { 45, "#CA8A04", "Other", "MoreHorizontal", "Special", 0, "Special", null },
                    { 46, "#16A34A", "Food & Drink", "Utensils", "Groceries", 0, "Groceries", null },
                    { 47, "#0D9488", "Health", "HeartPulse", "Sport", 0, "Sport", null },
                    { 48, "#2563EB", "Leisure", "Ticket", "Leisure", 0, "Leisure", null },
                    { 49, "#991B1B", "Bills", "Receipt", "Taxes", 0, "Taxes", null },
                    { 50, "#4F46E5", "Bills", "Receipt", "Phone", 0, "Phone", null },
                    { 51, "#C02688", "Leisure", "Ticket", "Film", 0, "Film", null },
                    { 52, "#334155", "Bills", "Receipt", "Insurance", 0, "Insurance", null },
                    { 53, "#7C2D12", "Home", "Home", "Lease", 0, "Lease", null },
                    { 54, "#9A3412", "Home", "Home", "Rent", 0, "Rent", null },
                    { 55, "#44403C", "Home", "Home", "Mortgage", 0, "Mortgage", null },
                    { 56, "#8B5CF6", "Money", "Wallet", "Loan", 0, "Loan", null },
                    { 57, "#6366F1", "Money", "Wallet", "Transfer", 3, "Transfer", null },
                    { 58, "#0F766E", "Money", "Wallet", "Withdraw", 0, "Withdraw", null }
                });

            // The enum was renumbered from 1 (Coffe = 1) to match the seeded Categories ids; EF cannot see that.
            migrationBuilder.Sql("UPDATE \"Transactions\" SET \"Category\" = \"Category\" + 1;");
            migrationBuilder.Sql("UPDATE \"CategoryRules\" SET \"TargetCategory\" = \"TargetCategory\" + 1;");

            migrationBuilder.RenameColumn(
                name: "Category",
                table: "Transactions",
                newName: "CategoryId");

            migrationBuilder.RenameColumn(
                name: "TargetCategory",
                table: "CategoryRules",
                newName: "TargetCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_CategoryId",
                table: "Transactions",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_CategoryRules_TargetCategoryId",
                table: "CategoryRules",
                column: "TargetCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_UserId",
                table: "Categories",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CategoryRules_Categories_TargetCategoryId",
                table: "CategoryRules",
                column: "TargetCategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Custom categories start at 1000, leaving room for new system ones below.
            migrationBuilder.Sql("SELECT setval(pg_get_serial_sequence('\"Categories\"', 'Id'), 1000, false);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CategoryRules_Categories_TargetCategoryId",
                table: "CategoryRules");

            migrationBuilder.DropForeignKey(
                name: "FK_Transactions_Categories_CategoryId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_Transactions_CategoryId",
                table: "Transactions");

            migrationBuilder.DropIndex(
                name: "IX_CategoryRules_TargetCategoryId",
                table: "CategoryRules");

            migrationBuilder.RenameColumn(
                name: "CategoryId",
                table: "Transactions",
                newName: "Category");

            migrationBuilder.RenameColumn(
                name: "TargetCategoryId",
                table: "CategoryRules",
                newName: "TargetCategory");

            migrationBuilder.Sql("UPDATE \"Transactions\" SET \"Category\" = \"Category\" - 1;");
            migrationBuilder.Sql("UPDATE \"CategoryRules\" SET \"TargetCategory\" = \"TargetCategory\" - 1;");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
