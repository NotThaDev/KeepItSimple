using System.Reflection;
using Xunit.Abstractions;
using Xunit.Sdk;

[assembly: TestFramework(
    "KeepItSimple.Api.Tests.Support.KeepItSimpleTestFramework",
    "KeepItSimple.Api.Tests")]

namespace KeepItSimple.Api.Tests.Support;

/// <summary>
/// xUnit framework wrapper that deletes generated import fixtures after a fully
/// successful assembly run.
/// </summary>
public sealed class KeepItSimpleTestFramework(IMessageSink diagnosticMessageSink) : XunitTestFramework(diagnosticMessageSink)
{
    protected override ITestFrameworkExecutor CreateExecutor(AssemblyName assemblyName)
        => new KeepItSimpleTestFrameworkExecutor(
            assemblyName,
            SourceInformationProvider,
            DiagnosticMessageSink);
}

internal sealed class KeepItSimpleTestFrameworkExecutor(
    AssemblyName assemblyName,
    ISourceInformationProvider sourceInformationProvider,
    IMessageSink diagnosticMessageSink) : XunitTestFrameworkExecutor(assemblyName, sourceInformationProvider, diagnosticMessageSink)
{
    protected override void RunTestCases(
        IEnumerable<IXunitTestCase> testCases,
        IMessageSink executionMessageSink,
        ITestFrameworkExecutionOptions executionOptions)
    {
        base.RunTestCases(
            testCases,
            new ImportFixtureCleanupSink(executionMessageSink),
            executionOptions);
    }
}

internal sealed class ImportFixtureCleanupSink(IMessageSink inner) : LongLivedMarshalByRefObject, IMessageSink
{
    private readonly IMessageSink _inner = inner;
    private int _infrastructureErrors;

    public bool OnMessage(IMessageSinkMessage message)
    {
        switch (message)
        {
            case IErrorMessage:
            case ITestCleanupFailure:
            case ITestClassCleanupFailure:
            case ITestCollectionCleanupFailure:
            case ITestAssemblyCleanupFailure:
                Interlocked.Increment(ref _infrastructureErrors);
                break;

            case ITestAssemblyFinished finished:
                if (finished.TestsFailed == 0 && Volatile.Read(ref _infrastructureErrors) == 0)
                {
                    ImportFixtures.DeleteGeneratedFilesIfPresent();
                }

                break;
        }

        return _inner.OnMessage(message);
    }
}
