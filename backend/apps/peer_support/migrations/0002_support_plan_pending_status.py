from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('peer_support', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='supportplan',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('active', 'Active'),
                    ('completed', 'Completed'),
                    ('cancelled', 'Cancelled'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
    ]
